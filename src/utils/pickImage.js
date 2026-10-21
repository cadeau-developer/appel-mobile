import { Alert, Platform } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { translateCurrent } from "../context/LanguageContext";

const MAX_IMAGE_BYTES = 2 * 1024 * 1024;

function deliverImage(dataUrl, onPick, onError) {
  if (!dataUrl) {
    onError?.("The selected image could not be read. Please try again.");
    return;
  }
  const base64 = dataUrl.split(",")[1] || "";
  const padding = base64.endsWith("==") ? 2 : base64.endsWith("=") ? 1 : 0;
  const imageBytes = (base64.length * 3) / 4 - padding;
  if (imageBytes > MAX_IMAGE_BYTES) {
    onError?.("Image must be smaller than 2 MB. Try a smaller photo.");
    return;
  }
  onPick(dataUrl);
}

function pickFromBrowser(onPick, onError, useCamera) {
  const input = document.createElement("input");
  input.type = "file";
  input.accept = "image/*";
  if (useCamera) {
    input.setAttribute("capture", "environment");
  }
  input.onchange = (event) => {
    const file = event.target?.files?.[0];
    if (!file) return;
    if (file.size > MAX_IMAGE_BYTES) {
      onError?.("Image must be smaller than 2 MB. Try a smaller photo.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => deliverImage(reader.result, onPick, onError);
    reader.onerror = () => onError?.("Could not read the selected image. Please try again.");
    reader.readAsDataURL(file);
  };
  input.click();
}

async function pickOnDevice(useCamera, onPick, onError) {
  try {
    if (useCamera) {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        onError?.("Camera access is needed to take a photo. Allow camera access in your device settings.");
        return;
      }
    }

    const result = useCamera
      ? await ImagePicker.launchCameraAsync({ mediaTypes: ["images"], quality: 0.7, base64: true })
      : await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], quality: 0.7, base64: true });
    if (result.canceled) return;
    const asset = result.assets?.[0];
    if (!asset?.base64) {
      onError?.("Could not read the selected image. Please try again.");
      return;
    }
    deliverImage(`data:${asset.mimeType || "image/jpeg"};base64,${asset.base64}`, onPick, onError);
  } catch (error) {
    onError?.(error.message || "Could not open the camera or photo library. Please try again.");
  }
}

export function pickImageFile(onPick, onError, source) {
  if (source === "camera" || source === "library") {
    const useCamera = source === "camera";
    if (Platform.OS === "web") {
      pickFromBrowser(onPick, onError, useCamera);
    } else {
      pickOnDevice(useCamera, onPick, onError);
    }
    return;
  }

  if (Platform.OS === "web") {
    pickFromBrowser(onPick, onError, false);
    return;
  }

  Alert.alert(
    translateCurrent("Add a picture"),
    translateCurrent("Take a new photo or choose one from your library."),
    [
      { text: translateCurrent("Cancel"), style: "cancel" },
      { text: translateCurrent("Take a photo"), onPress: () => pickOnDevice(true, onPick, onError) },
      { text: translateCurrent("Choose from library"), onPress: () => pickOnDevice(false, onPick, onError) },
    ]
  );
}