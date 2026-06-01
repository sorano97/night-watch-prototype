import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import { CameraView, useCameraPermissions } from "expo-camera";
import * as Location from "expo-location";
import { StatusBar } from "expo-status-bar";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  View
} from "react-native";
import type { ReportRequest, ReportType } from "./src/types";

const nicknameKey = "night-watch:nickname";
const apiBaseUrl = process.env.EXPO_PUBLIC_API_BASE_URL ?? "http://localhost:3000";

export default function App() {
  const [nickname, setNickname] = useState("");
  const [draftNickname, setDraftNickname] = useState("");
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [sendingType, setSendingType] = useState<ReportType | null>(null);
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();

  useEffect(() => {
    AsyncStorage.getItem(nicknameKey).then((value) => {
      if (value) {
        setNickname(value);
        setDraftNickname(value);
      }
    });
  }, []);

  useEffect(() => {
    if (!nickname) {
      return;
    }

    const timer = setInterval(() => {
      setElapsedSeconds((current) => current + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [nickname]);

  const elapsedLabel = useMemo(() => {
    const hours = Math.floor(elapsedSeconds / 3600).toString().padStart(2, "0");
    const minutes = Math.floor((elapsedSeconds % 3600) / 60).toString().padStart(2, "0");
    const seconds = Math.floor(elapsedSeconds % 60).toString().padStart(2, "0");
    return `${hours}:${minutes}:${seconds}`;
  }, [elapsedSeconds]);

  async function saveNickname() {
    const trimmed = draftNickname.trim();
    if (!trimmed) {
      Alert.alert("ニックネームを入力してください");
      return;
    }

    await AsyncStorage.setItem(nicknameKey, trimmed);
    setNickname(trimmed);
  }

  async function submitReport(type: ReportType) {
    try {
      setSendingType(type);
      const locationPermission = await Location.requestForegroundPermissionsAsync();

      if (locationPermission.status !== "granted") {
        Alert.alert("位置情報の許可が必要です", "通知を送信するには位置情報の利用を許可してください。");
        return;
      }

      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High
      });

      const payload: ReportRequest = {
        nickname,
        type,
        latitude: position.coords.latitude,
        longitude: position.coords.longitude
      };

      const response = await fetch(`${apiBaseUrl}/api/reports`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      const json = await response.json();
      if (!response.ok || !json.success) {
        throw new Error(json.error ?? "通知の送信に失敗しました");
      }

      Alert.alert("送信しました", type === "emergency" ? "緊急通報を送信しました。" : "見守り依頼を送信しました。");
    } catch (error) {
      Alert.alert("送信できませんでした", error instanceof Error ? error.message : "時間をおいて再度お試しください。");
    } finally {
      setSendingType(null);
    }
  }

  if (!nickname) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar style="light" />
        <View style={styles.nicknameScreen}>
          <View style={styles.nicknameHeader}>
            <View style={styles.shieldIcon}>
              <Ionicons name="shield-checkmark" size={28} color="#061017" />
            </View>
            <Text style={styles.nicknameTitle}>夜道見守り</Text>
            <Text style={styles.nicknameLead}>管理画面に表示するニックネームを登録してください。</Text>
          </View>
          <TextInput
            value={draftNickname}
            onChangeText={setDraftNickname}
            placeholder="例: さくら"
            placeholderTextColor="#64748b"
            style={styles.input}
            maxLength={24}
            autoCapitalize="none"
          />
          <Pressable style={styles.primaryButton} onPress={saveNickname}>
            <Text style={styles.primaryButtonText}>はじめる</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const hasCameraPermission = cameraPermission?.granted;

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="light" />
      <View style={styles.app}>
        <View style={styles.callBar}>
          <View style={styles.callState}>
            <Ionicons name="shield-checkmark" size={22} color="#5ee285" />
            <Text style={styles.callStateText}>安全に通話中</Text>
          </View>
          <Text style={styles.timer}>{elapsedLabel}</Text>
          <Pressable style={styles.menuButton} accessibilityLabel="メニュー">
            <Ionicons name="ellipsis-horizontal" size={24} color="#f8fafc" />
          </Pressable>
        </View>

        {!cameraPermission ? (
          <CameraPlaceholder label="カメラ権限を確認中" />
        ) : !hasCameraPermission ? (
          <View style={styles.permissionBox}>
            <Ionicons name="camera" size={34} color="#94a3b8" />
            <Text style={styles.permissionText}>カメラ表示には許可が必要です。</Text>
            <Pressable style={styles.permissionButton} onPress={requestCameraPermission}>
              <Text style={styles.permissionButtonText}>カメラを許可</Text>
            </Pressable>
          </View>
        ) : (
          <View style={styles.cameraStack}>
            <CameraPanel label="内側カメラ（自分側）" facing="front" />
            <CameraPanel label="外側カメラ（後ろ側）" facing="back" />
          </View>
        )}

        <View style={styles.actions}>
          <ActionButton
            icon="warning-outline"
            label="緊急通報"
            caption="すぐに助けを呼びます"
            tone="danger"
            loading={sendingType === "emergency"}
            disabled={Boolean(sendingType)}
            onPress={() => submitReport("emergency")}
          />
          <ActionButton
            icon="eye-outline"
            label="様子を見てほしい"
            caption="見守りをお願いします"
            tone="watch"
            loading={sendingType === "watch"}
            disabled={Boolean(sendingType)}
            onPress={() => submitReport("watch")}
          />
        </View>

        <View style={styles.notice}>
          <Ionicons name="lock-closed-outline" size={18} color="#94a3b8" />
          <Text style={styles.noticeText}>ボタンを押すと、位置情報が管理者に送信されます</Text>
        </View>

        <View style={styles.bottomNav}>
          <NavItem icon="call" label="通話中" active />
          <NavItem icon="time" label="履歴" />
          <NavItem icon="settings" label="設定" />
          <NavItem icon="information-circle" label="使い方" />
        </View>
      </View>
    </SafeAreaView>
  );
}

function CameraPanel({ label, facing }: { label: string; facing: "front" | "back" }) {
  return (
    <View style={styles.cameraPanel}>
      <CameraView style={styles.camera} facing={facing}>
        <View style={styles.cameraOverlay}>
          <View style={styles.cameraLabel}>
            <View style={styles.onlineDot} />
            <Text style={styles.cameraLabelText}>{label}</Text>
          </View>
          <View style={styles.switchButton}>
            <Ionicons name="camera-reverse-outline" size={28} color="#ffffff" />
          </View>
        </View>
      </CameraView>
    </View>
  );
}

function CameraPlaceholder({ label }: { label: string }) {
  return (
    <View style={styles.permissionBox}>
      <ActivityIndicator color="#7dd3fc" />
      <Text style={styles.permissionText}>{label}</Text>
    </View>
  );
}

function ActionButton({
  icon,
  label,
  caption,
  tone,
  loading,
  disabled,
  onPress
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  caption: string;
  tone: "danger" | "watch";
  loading: boolean;
  disabled: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.actionButton,
        tone === "danger" ? styles.dangerButton : styles.watchButton,
        (pressed || disabled) && styles.pressedButton
      ]}
      disabled={disabled}
      onPress={onPress}
    >
      {loading ? <ActivityIndicator color="#ffffff" /> : <Ionicons name={icon} size={38} color="#ffffff" />}
      <Text style={styles.actionLabel}>{label}</Text>
      <Text style={styles.actionCaption}>{caption}</Text>
    </Pressable>
  );
}

function NavItem({
  icon,
  label,
  active = false
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  active?: boolean;
}) {
  return (
    <View style={styles.navItem}>
      <Ionicons name={icon} size={28} color={active ? "#8b80ff" : "#9ca3af"} />
      <Text style={[styles.navLabel, active && styles.navLabelActive]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#061017"
  },
  app: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 8
  },
  callBar: {
    minHeight: 74,
    borderRadius: 22,
    backgroundColor: "#151b2a",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
    paddingHorizontal: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between"
  },
  callState: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flex: 1
  },
  callStateText: {
    color: "#63ed8f",
    fontSize: 16,
    fontWeight: "800"
  },
  timer: {
    color: "#cbd5e1",
    fontSize: 20,
    fontWeight: "700"
  },
  menuButton: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: "rgba(255,255,255,0.1)",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 12
  },
  cameraStack: {
    flex: 1,
    gap: 12,
    marginTop: 16
  },
  cameraPanel: {
    flex: 1,
    minHeight: 190,
    borderRadius: 22,
    overflow: "hidden",
    backgroundColor: "#101820",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)"
  },
  camera: {
    flex: 1
  },
  cameraOverlay: {
    flex: 1,
    padding: 14,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start"
  },
  cameraLabel: {
    minHeight: 40,
    borderRadius: 12,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.62)",
    gap: 8
  },
  onlineDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#57e38a"
  },
  cameraLabelText: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "800"
  },
  switchButton: {
    width: 54,
    height: 54,
    borderRadius: 14,
    backgroundColor: "rgba(0,0,0,0.48)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    alignItems: "center",
    justifyContent: "center"
  },
  actions: {
    flexDirection: "row",
    gap: 14,
    paddingTop: 18
  },
  actionButton: {
    flex: 1,
    minHeight: 142,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    padding: 12
  },
  dangerButton: {
    backgroundColor: "#df2448"
  },
  watchButton: {
    backgroundColor: "#eab82d"
  },
  pressedButton: {
    opacity: 0.72
  },
  actionLabel: {
    marginTop: 10,
    color: "#ffffff",
    fontSize: 20,
    fontWeight: "900",
    textAlign: "center"
  },
  actionCaption: {
    marginTop: 6,
    color: "rgba(255,255,255,0.88)",
    fontSize: 13,
    fontWeight: "700",
    textAlign: "center"
  },
  notice: {
    minHeight: 50,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8
  },
  noticeText: {
    color: "#9ca3af",
    fontSize: 13,
    fontWeight: "700"
  },
  bottomNav: {
    height: 84,
    marginHorizontal: -16,
    paddingHorizontal: 18,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.06)",
    backgroundColor: "#111827",
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center"
  },
  navItem: {
    alignItems: "center",
    justifyContent: "center",
    width: 70
  },
  navLabel: {
    marginTop: 6,
    color: "#9ca3af",
    fontSize: 12,
    fontWeight: "700"
  },
  navLabelActive: {
    color: "#8b80ff"
  },
  permissionBox: {
    flex: 1,
    marginTop: 16,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    backgroundColor: "#111827",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    padding: 24
  },
  permissionText: {
    color: "#cbd5e1",
    fontSize: 15,
    fontWeight: "700",
    textAlign: "center"
  },
  permissionButton: {
    borderRadius: 14,
    backgroundColor: "#38bdf8",
    paddingHorizontal: 18,
    paddingVertical: 12
  },
  permissionButtonText: {
    color: "#031017",
    fontWeight: "900"
  },
  nicknameScreen: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
    gap: 16
  },
  nicknameHeader: {
    gap: 10,
    marginBottom: 10
  },
  shieldIcon: {
    width: 56,
    height: 56,
    borderRadius: 18,
    backgroundColor: "#63ed8f",
    alignItems: "center",
    justifyContent: "center"
  },
  nicknameTitle: {
    color: "#ffffff",
    fontSize: 34,
    fontWeight: "900"
  },
  nicknameLead: {
    color: "#b6c2d1",
    fontSize: 15,
    lineHeight: 22
  },
  input: {
    minHeight: 58,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    backgroundColor: "#111827",
    color: "#ffffff",
    paddingHorizontal: 16,
    fontSize: 18,
    fontWeight: "700"
  },
  primaryButton: {
    minHeight: 58,
    borderRadius: 16,
    backgroundColor: "#63ed8f",
    alignItems: "center",
    justifyContent: "center"
  },
  primaryButtonText: {
    color: "#061017",
    fontSize: 17,
    fontWeight: "900"
  }
});
