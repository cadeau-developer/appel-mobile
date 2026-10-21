import React from "react";
import { Text as NativeText } from "react-native";
import { useLanguage } from "../context/LanguageContext";

export default function LocalizedText({ children, ...props }) {
  const { translate } = useLanguage();
  const localizedChildren = React.Children.map(children, (child) =>
    typeof child === "string" ? translate(child) : child
  );

  return <NativeText {...props}>{localizedChildren}</NativeText>;
}
