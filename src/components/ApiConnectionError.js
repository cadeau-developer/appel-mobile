import React from "react";
import { StyleSheet, View } from "react-native";
import Button from "./Button";
import EmptyState from "./EmptyState";
import { API_BASE_URL } from "../api/client";
import { spacing } from "../theme";

function messageForError(error) {
  const serverMessage = error?.response?.data?.error;
  if (serverMessage) return serverMessage;
  if (!error?.response) {
    return `Cannot reach the API at ${API_BASE_URL}. Make sure the backend is running and your device is on the same network.`;
  }
  return `The server returned an error (${error.response.status}). Please try again.`;
}

export default function ApiConnectionError({ error, onRetry, title = "Couldn't load data" }) {
  return (
    <View style={styles.wrap}>
      <EmptyState icon="cloud-offline-outline" title={title} subtitle={messageForError(error)} />
      <Button title="Try again" icon="refresh-outline" onPress={onRetry} size="sm" />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: "center", paddingVertical: spacing(4) },
});
