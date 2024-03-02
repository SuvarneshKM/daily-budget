import * as React from "react";
import {
  Alert,
  Button,
  Modal,
  Pressable,
  SafeAreaView,
  ScrollView,
  Text,
  TextInput,
  ToastAndroid,
  TouchableOpacity,
  View,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import Card from "./ui/Card";
import SegmentedControl from "@react-native-segmented-control/segmented-control";
import { useSQLiteContext } from "expo-sqlite/next";
import { Category, Transaction } from "@/types/types";
import { throttle } from "lodash";

export default function AddTransaction({
  insertTransaction,
  insertCategory,
}: {
  insertTransaction(transaction: Transaction): Promise<void>;
  insertCategory(category: Category): Promise<void>;
}) {
  const [isAddingTransaction, setIsAddingTransaction] =
    React.useState<boolean>(false);
  const [currentTab, setCurrentTab] = React.useState<number>(0);
  const [categories, setCategories] = React.useState<Category[]>([]);
  const [typeSelected, setTypeSelected] = React.useState<string>("");
  const [categoryName, setCategoryName] = React.useState<string>("");
  const [amount, setAmount] = React.useState<string>("");
  const [description, setDescription] = React.useState<string>("");
  const [category, setCategory] = React.useState<string>("Expense");
  const [categoryId, setCategoryId] = React.useState<number>(1);

  const [modalVisible, setModalVisible] = React.useState(false);

  const db = useSQLiteContext();

  const scrollViewRef = React.useRef<ScrollView>(null);

  const throttledScrollToStart = React.useRef(
    throttle(() => {
      if (scrollViewRef.current) {
        scrollViewRef.current.scrollTo({ x: 0, y: 0, animated: true });
      }
    }, 200)
  ).current;

  const scrollToStart = () => {
    throttledScrollToStart();
  };

  React.useEffect(() => {
    getExpenseType(currentTab, false);
  }, [currentTab]);

  async function getExpenseType(currentTab: number, isNew: boolean) {
    setCategory(currentTab === 0 ? "Expense" : "Income");
    scrollToStart();

    const type = currentTab === 0 ? "Expense" : "Income";

    const result = await db.getAllAsync<Category>(
      `SELECT * FROM Categories WHERE type = ?;`,
      [type]
    );

    if (isNew) {
      setCategoryId(result[result.length - 1].id);
      setTypeSelected(result[result.length - 1].name);
    } else {
      setCategoryId(result[0].id);
      setTypeSelected(result[0].name);
    }

    setCategories(result);
  }

  function isStringPresent(searchString: string): boolean {
    for (const item of categories) {
      if (item.name === searchString) {
        return true;
      }
    }
    return false;
  }
  async function handleCat() {
    if (!isStringPresent(categoryName)) {
      // @ts-ignore
      await insertCategory({
        name: categoryName,
        type: category as "Expense" | "Income",
      });

      getExpenseType(currentTab, true);
    } else {
      ToastAndroid.show("Category Name already exists", ToastAndroid.SHORT);
    }
  }

  async function handleSave() {
    // @ts-ignore
    await insertTransaction({
      amount: Number(amount),
      description,
      category_id: categoryId,
      date: new Date().getTime() / 1000,
      type: category as "Expense" | "Income",
    });
    setAmount("");
    setDescription("");
    setCategory("Expense");
    setCategoryId(1);
    setCurrentTab(0);
    setIsAddingTransaction(false);
  }

  return (
    <View style={{ marginBottom: 15 }}>
      {isAddingTransaction ? (
        <Modal
          presentationStyle="formSheet"
          animationType="slide"
          transparent={false}
          visible={isAddingTransaction}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <SafeAreaView style={{ padding: 24 }}>
            <View
              style={{
                display: "flex",
                flexDirection: "column",
                rowGap: 40,
              }}
            >
              <View
                style={{
                  display: "flex",
                  alignItems: "center",
                  flexDirection: "row",
                  justifyContent: "space-between",
                }}
              >
                <TouchableOpacity onPress={() => setIsAddingTransaction(false)}>
                  <MaterialIcons name="arrow-back" size={32} color="#000" />
                </TouchableOpacity>
                <Text
                  style={{ color: "#000", fontSize: 20, fontWeight: "700" }}
                >
                  Add Expense
                </Text>
                <Text></Text>
              </View>
              <View style={{ backgroundColor: "#fff" }}>
                <View>
                  <TextInput
                    placeholder="₹Amount"
                    style={{
                      fontSize: 32,
                      marginBottom: 15,
                      fontWeight: "bold",
                    }}
                    keyboardType="numeric"
                    onChangeText={(text) => {
                      // Remove any non-numeric characters before setting the state
                      const numericValue = text.replace(/[^0-9.]/g, "");
                      setAmount(numericValue);
                    }}
                  />
                  <TextInput
                    placeholder="Description"
                    style={{ marginBottom: 15, fontSize: 16 }}
                    onChangeText={setDescription}
                  />
                  <Text style={{ marginBottom: 6 }}>Select a entry type</Text>
                  <SegmentedControl
                    values={["Expense", "Income"]}
                    style={{ marginBottom: 15 }}
                    selectedIndex={currentTab}
                    onChange={(event) => {
                      setCurrentTab(event.nativeEvent.selectedSegmentIndex);
                    }}
                  />
                  <View
                    style={{
                      display: "flex",
                      flexDirection: "row",
                      flexWrap: "wrap",
                      width: "100%",
                      overflow: "scroll",
                    }}
                  >
                    {categories.map((cat) => (
                      <CategoryButton
                        key={cat.name}
                        // @ts-ignore
                        id={cat.id}
                        title={cat.name}
                        isSelected={typeSelected === cat.name}
                        setTypeSelected={setTypeSelected}
                        setCategoryId={setCategoryId}
                      />
                    ))}
                    <AddNewCategory
                      setCategoryName={setCategoryName}
                      handleCat={handleCat}
                    />
                  </View>
                </View>

                <View
                  style={{
                    display: "flex",
                    rowGap: 20,
                    paddingTop: 40,
                    alignItems: "center",
                    flexDirection: "column",
                    width: "auto",
                  }}
                >
                  <TouchableOpacity
                    style={{
                      backgroundColor: "#000",
                      borderWidth: 1,
                      borderColor: "#000",
                      width: "100%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      paddingVertical: 12,
                      borderRadius: 50,
                    }}
                    onPress={handleSave}
                  >
                    <Text
                      style={{ color: "#fff", fontWeight: "600", fontSize: 16 }}
                    >
                      Create
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={{
                      backgroundColor: "#fff",
                      borderWidth: 1,
                      borderColor: "#000",
                      width: "100%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      paddingVertical: 12,
                      borderRadius: 50,
                    }}
                    onPress={() => setIsAddingTransaction(false)}
                  >
                    <Text
                      style={{ color: "#000", fontWeight: "600", fontSize: 16 }}
                    >
                      Cancel
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </SafeAreaView>
        </Modal>
      ) : (
        <AddButton setIsAddingTransaction={setIsAddingTransaction} />
      )}
    </View>
  );
}

function AddNewCategory({
  setCategoryName,
  handleCat,
}: {
  setCategoryName: React.Dispatch<React.SetStateAction<string>>;
  handleCat: any;
}) {
  const [isInput, setIsInput] = React.useState(false);
  let InputRef = React.useRef<any>();

  return !isInput ? (
    <TouchableOpacity
      onPress={() => setIsInput(true)}
      activeOpacity={0.6}
      style={{
        width: "auto",
        paddingRight: 10,
        paddingLeft: 10,
        marginRight: 10,
        height: 30,
        overflow: "scroll",
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#007BFF20",
        borderRadius: 15,
        marginBottom: 6,
      }}
    >
      <MaterialIcons name="add-circle-outline" size={16} color="#007BFF" />
      <Text style={{ fontWeight: "700", color: "#007BFF", marginLeft: 5 }}>
        New Category
      </Text>
    </TouchableOpacity>
  ) : (
    <Modal
      presentationStyle="formSheet"
      animationType="slide"
      transparent={false}
      visible={isInput}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <SafeAreaView style={{ padding: 24 }}>
        <View
          style={{
            display: "flex",
            flexDirection: "column",
            rowGap: 40,
          }}
        >
          <View
            style={{
              display: "flex",
              alignItems: "center",
              flexDirection: "row",
              justifyContent: "space-between",
            }}
          >
            <TouchableOpacity onPress={() => setIsInput(false)}>
              <MaterialIcons name="arrow-back" size={32} color="#000" />
            </TouchableOpacity>
            <Text style={{ color: "#000", fontSize: 20, fontWeight: "700" }}>
              Add Category
            </Text>
            <Text></Text>
          </View>
          <View
            style={{
              display: "flex",
              alignItems: "center",
              flexDirection: "column",
              rowGap: 16,
            }}
          >
            <View
              style={{
                borderRadius: 4,
                borderWidth: 1,
                borderColor: "#000",
                width: "100%",
              }}
            >
              <TextInput
                ref={InputRef}
                placeholder="New Category"
                inputMode="text"
                autoFocus
                maxLength={20}
                style={{
                  fontWeight: "700",
                  color: "#000",
                  width: "100%",
                  paddingHorizontal: 5,
                  paddingVertical: 5,
                }}
                onChangeText={setCategoryName}
              />
            </View>
            <View
              style={{
                display: "flex",
                alignItems: "center",
                flexDirection: "column",
                rowGap: 4,
                width: "100%",
              }}
            >
              <TouchableOpacity
                onPress={() => {
                  handleCat();
                  setIsInput(false);
                }}
                style={{
                  width: "100%",
                  borderWidth: 1,
                  borderColor: "#000",
                  backgroundColor: "#000",
                  borderRadius: 4,
                }}
              >
                <Text
                  style={{
                    color: "#fff",
                    fontSize: 16,
                    fontWeight: "500",
                    paddingVertical: 6,
                    textAlign: "center",
                  }}
                >
                  Submit
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setIsInput(false)}
                style={{
                  width: "100%",
                  borderWidth: 1,
                  borderColor: "#000",
                  backgroundColor: "#fff",
                  borderRadius: 4,
                }}
              >
                <Text
                  style={{
                    color: "#000",
                    fontSize: 16,
                    fontWeight: "500",
                    paddingVertical: 6,
                    textAlign: "center",
                  }}
                >
                  Cancel
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

function CategoryButton({
  id,
  title,
  isSelected,
  setTypeSelected,
  setCategoryId,
}: {
  id: number;
  title: string;
  isSelected: boolean;
  setTypeSelected: React.Dispatch<React.SetStateAction<string>>;
  setCategoryId: React.Dispatch<React.SetStateAction<number>>;
}) {
  return (
    <TouchableOpacity
      onPress={() => {
        setTypeSelected(title);
        setCategoryId(id);
      }}
      activeOpacity={0.6}
      style={{
        width: "auto",
        paddingRight: 10,
        paddingLeft: 10,
        marginRight: 10,
        height: 30,
        overflow: "scroll",
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: isSelected ? "#007BFF20" : "#00000020",
        borderRadius: 15,
        marginBottom: 6,
      }}
    >
      <Text
        style={{
          fontWeight: "700",
          color: isSelected ? "#007BFF" : "#000000",
          marginLeft: 5,
        }}
      >
        {title}
      </Text>
    </TouchableOpacity>
  );
}

function AddButton({
  setIsAddingTransaction,
}: {
  setIsAddingTransaction: React.Dispatch<React.SetStateAction<boolean>>;
}) {
  return (
    <TouchableOpacity
      onPress={() => setIsAddingTransaction(true)}
      activeOpacity={0.6}
      style={{
        height: 40,
        flexDirection: "row",
        alignItems: "center",

        justifyContent: "center",
        backgroundColor: "#007BFF20",
        borderRadius: 15,
      }}
    >
      <MaterialIcons name="add-circle-outline" size={24} color="#007BFF" />
      <Text style={{ fontWeight: "700", color: "#007BFF", marginLeft: 5 }}>
        New Entry
      </Text>
    </TouchableOpacity>
  );
}
