import { StyleSheet, Text, View } from "react-native";
import { colors, spacing } from "../../theme";

export const UploadScreenHeader = () => (
  <View style={styles.header}>
    <Text style={styles.eyebrow}>Chunked transfer console</Text>
    <Text style={styles.title}>Media Upload</Text>
    <Text style={styles.subtitle}>
      Pick, capture, pause, resume, and track image or video uploads.
    </Text>
  </View>
);

const styles = StyleSheet.create({
  header: {
    gap: spacing.xs,
    paddingTop: spacing.sm,
  },
  eyebrow: {
    color: colors.primaryDark,
    fontSize: 13,
    fontWeight: "800",
    textTransform: "uppercase",
  },
  title: {
    color: colors.text,
    fontSize: 32,
    fontWeight: "900",
  },
  subtitle: {
    color: colors.muted,
    fontSize: 15,
    lineHeight: 21,
  },
});
