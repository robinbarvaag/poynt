import { beforeEach, describe, expect, test } from "bun:test";
import { useCart } from "./index";

beforeEach(() => {
  useCart.setState({ items: [] });
});

describe("useCart", () => {
  test("addItem legger til en linje med antall 1 som standard", () => {
    useCart.getState().addItem({ id: "p1", name: "Produkt 1", price: 100 });

    const items = useCart.getState().items;
    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({
      key: "p1",
      id: "p1",
      name: "Produkt 1",
      price: 100,
      quantity: 1,
    });
  });

  test("addItem to ganger med samme produkt-id slår sammen til én linje med antall 2", () => {
    useCart.getState().addItem({ id: "p1", name: "Produkt 1", price: 100 });
    useCart.getState().addItem({ id: "p1", name: "Produkt 1", price: 100 });

    const items = useCart.getState().items;
    expect(items).toHaveLength(1);
    expect(items[0].quantity).toBe(2);
  });

  test("addItem med maxQuantity: 1 to ganger holder antall klemt til 1", () => {
    useCart.getState().addItem({
      id: "p1",
      name: "Digitalt produkt",
      price: 100,
      maxQuantity: 1,
    });
    useCart.getState().addItem({
      id: "p1",
      name: "Digitalt produkt",
      price: 100,
      maxQuantity: 1,
    });

    const items = useCart.getState().items;
    expect(items).toHaveLength(1);
    expect(items[0].quantity).toBe(1);
  });

  test("samme produkt-id med ulik variantValue gir to separate linjer", () => {
    useCart.getState().addItem({
      id: "p1",
      name: "Bok",
      price: 100,
      variantLabel: "Signert?",
      variantValue: "Ja",
    });
    useCart.getState().addItem({
      id: "p1",
      name: "Bok",
      price: 100,
      variantLabel: "Signert?",
      variantValue: "Nei",
    });

    const items = useCart.getState().items;
    expect(items).toHaveLength(2);
    expect(items.map((i) => i.key).sort()).toEqual(["p1::Ja", "p1::Nei"]);
  });

  test("updateQuantity klemmer til maxQuantity og floorer til minst 1", () => {
    useCart.getState().addItem({
      id: "p1",
      name: "Produkt 1",
      price: 100,
      maxQuantity: 3,
    });

    useCart.getState().updateQuantity("p1", 10);
    expect(useCart.getState().items[0].quantity).toBe(3);

    useCart.getState().updateQuantity("p1", 0);
    expect(useCart.getState().items[0].quantity).toBe(1);
  });

  test("removeItem fjerner kun den valgte linje-nøkkelen", () => {
    useCart.getState().addItem({ id: "p1", name: "Produkt 1", price: 100 });
    useCart.getState().addItem({ id: "p2", name: "Produkt 2", price: 200 });

    useCart.getState().removeItem("p1");

    const items = useCart.getState().items;
    expect(items).toHaveLength(1);
    expect(items[0].key).toBe("p2");
  });

  test("total() summerer pris*antall og count() summerer antall", () => {
    useCart.getState().addItem({ id: "p1", name: "Produkt 1", price: 100 }, 2);
    useCart.getState().addItem({ id: "p2", name: "Produkt 2", price: 50 }, 3);

    expect(useCart.getState().total()).toBe(100 * 2 + 50 * 3);
    expect(useCart.getState().count()).toBe(5);
  });

  test("clearCart() tømmer items", () => {
    useCart.getState().addItem({ id: "p1", name: "Produkt 1", price: 100 });
    useCart.getState().clearCart();

    expect(useCart.getState().items).toEqual([]);
  });
});
