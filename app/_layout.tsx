import FontAwesome from "@expo/vector-icons/FontAwesome";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as FileSystem from "expo-file-system";
import * as SplashScreen from "expo-splash-screen";
import { Suspense, useEffect, useState } from "react";
import * as SQLite from "expo-sqlite";
import { Asset } from "expo-asset";
import { ActivityIndicator, Text, View } from "react-native";
import { SQLiteProvider } from "expo-sqlite/next";
import { Image } from "expo-image";

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from "expo-router";

export const unstable_settings = {
  // Ensure that reloading on `/modal` keeps a back button present.
  initialRouteName: "(tabs)",
};

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

const loadDatabase = async () => {
  const dbName = "mySQLiteDB.db";
  const dbAsset = require("../assets/mySQLiteDB.db");
  const dbUri = Asset.fromModule(dbAsset).uri;
  const dbFilePath = `${FileSystem.documentDirectory}SQLite/${dbName}`;

  const fileInfo = await FileSystem.getInfoAsync(dbFilePath);
  if (!fileInfo.exists) {
    await FileSystem.makeDirectoryAsync(
      `${FileSystem.documentDirectory}SQLite`,
      { intermediates: true }
    );
    await FileSystem.downloadAsync(dbUri, dbFilePath);
  }
};

export default function RootLayout() {
  const [dbLoaded, setDbLoaded] = useState<boolean>(false);

  useEffect(() => {
    loadDatabase()
      .then(() => setDbLoaded(true))
      .catch((e) => console.error(e));
  }, []);

  const [loaded, error] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
    ...FontAwesome.font,
  });

  // Expo Router uses Error Boundaries to catch errors in the navigation tree.
  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  if (!dbLoaded)
    return (
      <View style={{ flex: 1 }}>
        <Image
          style={{
            height: "100%",
            width: "100%",
          }}
          source={require("../assets/images/splashs.png")}
          contentFit="contain"
        />
      </View>
    );

  return <RootLayoutNav />;
}

function RootLayoutNav() {
  return (
    <Suspense
      fallback={
        <View style={{ flex: 1 }}>
          <Image
            style={{
              height: "100%",
              width: "100%",
            }}
            source={require("../assets/images/splashs.png")}
            contentFit="contain"
          />
        </View>
      }
    >
      <SQLiteProvider databaseName="mySQLiteDB.db" useSuspense>
        <Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        </Stack>
      </SQLiteProvider>
    </Suspense>
  );
}
