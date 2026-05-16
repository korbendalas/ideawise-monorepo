import { StyleSheet, View } from "react-native";
import { spacing } from "../../theme";
import { UploadAction, getAvailableActions } from "../../utils/uploadStatus";
import { ActionButtonTone, ActionIconButton } from "../ActionIconButton";
import type { UploadTaskActionsProps } from "./UploadTaskCard.types";

export const UploadTaskActions = ({
  localId,
  status,
  onPause,
  onResume,
  onCancel,
}: UploadTaskActionsProps) => {
  const actions = getAvailableActions(status);

  if (actions.length === 0) {
    return null;
  }

  return (
    <View style={styles.actions}>
      {actions.includes(UploadAction.Pause) ? (
        <ActionIconButton label="Pause" onPress={() => onPause(localId)} />
      ) : null}
      {actions.includes(UploadAction.Resume) ? (
        <ActionIconButton
          label="Resume"
          tone={ActionButtonTone.Primary}
          onPress={() => onResume(localId)}
        />
      ) : null}
      {actions.includes(UploadAction.Cancel) ? (
        <ActionIconButton
          label="Cancel"
          tone={ActionButtonTone.Danger}
          onPress={() => onCancel(localId)}
        />
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  actions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
});
