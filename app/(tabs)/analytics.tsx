import { ScrollView, StyleSheet, Text, TextStyle, View } from "react-native";
import {
  Category,
  Transaction,
  TransactionsByAllMonth,
  TransactionsByMonth,
} from "@/types/types";
import { useSQLiteContext } from "expo-sqlite/next";
import TransactionList from "@/components/TransactionsList";
import Card from "@/components/ui/Card";
import { SetStateAction, useCallback, useEffect, useState } from "react";
import AddTransaction from "@/components/AddTransaction";
import { useFocusEffect } from "expo-router";

interface MonthTimestamps {
  startOfMonthTimestamp: number;
  endOfMonthTimestamp: number;
  formattedMonthYear: string;
}

interface TransactionsByMonthAll {
  totalIncome: number;
  totalExpenses: number;
  date: string;
}

export default function Analytics() {
  const [transactionsByMonth, setTransactionsByMonth] = useState<
    TransactionsByAllMonth[]
  >([
    {
      formattedMonthYear: "",
      transactionsByMonth: [{ totalExpenses: 0, totalIncome: 0 }],
    },
  ]);

  const db = useSQLiteContext();

  useEffect(() => {
    db.withTransactionAsync(async () => {
      await getData();
    });
  }, [db]);

  async function fetchAll() {
    await getData();
  }

  useFocusEffect(
    useCallback(() => {
      fetchAll();
    }, [])
  );

  async function getData() {
    const result = await db.getAllAsync<Transaction>(
      `SELECT * FROM Transactions ORDER BY date DESC;`
    );

    const startAndEndOfMonthTimestamps: MonthTimestamps[] =
      getStartAndEndOfMonthTimestamps(result);

    const getValuePromises = startAndEndOfMonthTimestamps.map(
      async ({
        startOfMonthTimestamp,
        endOfMonthTimestamp,
        formattedMonthYear,
      }) => {
        const transactionsByMonth = await db.getAllAsync<TransactionsByMonth>(
          `
            SELECT
                COALESCE(SUM(CASE WHEN type = 'Expense' THEN amount ELSE 0 END), 0) AS totalExpenses,
                COALESCE(SUM(CASE WHEN type = 'Income' THEN amount ELSE 0 END), 0) AS totalIncome
            FROM Transactions
            WHERE date >= ? AND date <= ?;
            `,
          [startOfMonthTimestamp, endOfMonthTimestamp]
        );
        return { transactionsByMonth, formattedMonthYear };
      }
    );

    const resolvedValues: any[] = await Promise.all(getValuePromises);
    setTransactionsByMonth(resolvedValues);
  }

  function getStartAndEndOfMonthTimestamps(
    list: { date: number }[]
  ): MonthTimestamps[] {
    const uniqueMonths: Set<string> = new Set();
    const result: MonthTimestamps[] = [];

    list.forEach((item) => {
      const date = new Date(item.date * 1000);
      const formattedMonthYear = `${getMonthName(
        date.getMonth()
      )} ${date.getFullYear()}`;
      const monthYear = `${date.getMonth()}/${date.getFullYear()}`;
      if (!uniqueMonths.has(monthYear)) {
        uniqueMonths.add(monthYear);
        const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
        const endOfMonth = new Date(
          date.getFullYear(),
          date.getMonth() + 1,
          0,
          23,
          59,
          59
        );
        result.push({
          startOfMonthTimestamp: Math.floor(startOfMonth.getTime() / 1000),
          endOfMonthTimestamp: Math.floor(endOfMonth.getTime() / 1000),
          formattedMonthYear,
        });
      }
    });

    return result;
  }

  function getMonthName(month: number): string {
    const monthNames = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];
    return monthNames[month];
  }

  return (
    <ScrollView contentContainerStyle={{ padding: 15 }}>
      {transactionsByMonth.length > 0 ? (
        transactionsByMonth.map((val, ind) => (
          <TransactionSummary
            key={ind}
            totalExpenses={val.transactionsByMonth[0].totalExpenses}
            totalIncome={val.transactionsByMonth[0].totalIncome}
            date={val.formattedMonthYear}
          />
        ))
      ) : (
        <Text>There is presently no history available.</Text>
      )}
    </ScrollView>
  );
}

function TransactionSummary({
  totalIncome,
  totalExpenses,
  date,
}: TransactionsByMonthAll) {
  const savings = totalIncome - totalExpenses;

  // Function to determine the style based on the value (positive or negative)
  const getMoneyTextStyle = (value: number): TextStyle => ({
    fontWeight: "bold",
    color: value < 0 ? "#ff4500" : "#2e8b57", // Red for negative, custom green for positive
  });

  // Helper function to format monetary values
  const formatMoney = (value: number) => {
    const absValue = Math.abs(value).toFixed(2);
    return `${value < 0 ? "-" : ""}₹${absValue}`;
  };

  return (
    <Card style={styles.container}>
      <Text style={styles.periodTitle}>Summary for {date}</Text>
      <Text style={styles.summaryText}>
        Income:{" "}
        <Text style={getMoneyTextStyle(totalIncome)}>
          {formatMoney(totalIncome)}
        </Text>
      </Text>
      <Text style={styles.summaryText}>
        Total Expenses:{" "}
        <Text style={getMoneyTextStyle(totalExpenses)}>
          {formatMoney(totalExpenses)}
        </Text>
      </Text>
      <Text style={styles.summaryText}>
        Savings:{" "}
        <Text style={getMoneyTextStyle(savings)}>{formatMoney(savings)}</Text>
      </Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 15,
    paddingBottom: 7,
    // Add other container styles as necessary
  },
  periodTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 15,
  },
  summaryText: {
    fontSize: 18,
    color: "#333",
    marginBottom: 10,
  },
  // Removed moneyText style since we're now generating it dynamically
});
