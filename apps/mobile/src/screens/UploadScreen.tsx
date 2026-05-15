import { UploadManager } from "@media-upload/upload-client";
import { useMemo, useState } from "react";
import { Button, SafeAreaView, StyleSheet, Text, View } from "react-native";

export function UploadScreen() {
  const manager = useMemo(() => new UploadManager(), []);
  const [status, setStatus] = useState("Ready to select image or video media.");

  function createPlaceholderTask() {
    const task = manager.addFile({
      name: "camera-or-picker-result.jpg",
      size: 2_500_000,
      type: "image/jpeg"
    });

    setStatus(`${task.file.name} queued in ${task.totalChunks} chunks.`);
  }

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.content}>
        <Text style={styles.title}>Media Upload</Text>
        <Text style={styles.body}>{status}</Text>
        <Button title="Mock picker result" onPress={createPlaceholderTask} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#f7f7f4"
  },
  content: {
    flex: 1,
    justifyContent: "center",
    padding: 24,
    gap: 16
  },
  title: {
    fontSize: 28,
    fontWeight: "700"
  },
  body: {
    fontSize: 16,
    lineHeight: 24
  }
});
