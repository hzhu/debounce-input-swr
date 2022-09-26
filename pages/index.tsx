import qs from "qs";
import useSWR from "swr";
import { useRef, useState, useEffect } from "react";
import { formatUnits, parseUnits } from "@ethersproject/units";
import type { NextPage } from "next";
import styles from "../styles/Home.module.css";

interface Price {
  buyAmount: string;
}

type SuccessFn = (data: Price) => void;

const DECIMALS = 18; // for WETH & DAI
const BASE_URL = "https://api.0x.org";
const TAKER = "0x4918fc71BD92F262c4D2F73804fa805de8602743";
const DAI_MAINNET = "0x6B175474E89094C44Da98b954EedeAC495271d0F";
const WETH_MAINNET = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";

const Home: NextPage = () => {
  const [sellAmount, setSellAmount] = useState("");
  const [buyAmount, setBuyAmount] = useState("");
  const debouncedSellAmount = useDebounce(sellAmount);
  const { isValidating, error } = usePrice(debouncedSellAmount, (data) => {
    setBuyAmount(formatUnits(data.buyAmount, DECIMALS));
  });

  return (
    <form className={styles.container}>
      <label>
        sell amount (WETH) &nbsp;
        <input
          type="text"
          minLength={1}
          maxLength={79}
          id="sell-amount"
          value={sellAmount}
          autoCorrect="off"
          autoComplete="off"
          spellCheck="false"
          inputMode="decimal"
          pattern="^[0-9]*[.,]?[0-9]*$"
          onChange={(e) => {
            if (e.target.validity.valid) {
              setSellAmount(e.target.value);
            }
          }}
        />
      </label>
      <div style={{ height: 25 }}>
        {error ? "Sad…" : isValidating ? "Loading…" : null}
      </div>
      <label>
        buy amount (DAI) &nbsp;
        <input
          type="text"
          minLength={1}
          maxLength={79}
          id="buy-amount"
          value={buyAmount}
          autoCorrect="off"
          autoComplete="off"
          spellCheck="false"
          inputMode="decimal"
          pattern="^[0-9]*[.,]?[0-9]*$"
          onChange={(e) => {
            if (e.target.validity.valid) {
              setBuyAmount(e.target.value);
            }
          }}
        />
      </label>
    </form>
  );
};

function usePrice(amount: string, onSuccess: SuccessFn) {
  return useSWR([`${BASE_URL}/swap/v1/price`, amount], async (url, amount) => {
    if (Number(amount) > 0) {
      try {
        const params = {
          takerAddress: TAKER,
          sellToken: WETH_MAINNET,
          buyToken: DAI_MAINNET,
          sellAmount: parseUnits(amount, DECIMALS).toString(),
        };
        const response = await fetch(`${url}?${qs.stringify(params)}`);
        const data = await response.json();
  
        onSuccess(data);
        
        return data;
      } catch (err) {
        // handle unexpected errors
        console.error(err)
      }
    }
  });
}

function useDebounce<T>(value: T, wait: number = 250) {
  let timerId = useRef<number>();
  const [debouncedValue, setDeboucnedValue] = useState<T>(value);

  useEffect(() => {
    if (timerId.current) {
      window.clearTimeout(timerId.current);
    }

    timerId.current = window.setTimeout(() => {
      setDeboucnedValue(value);
    }, wait);

    return () => {
      window.clearTimeout(timerId.current);
    };
  }, [value, wait]);

  return debouncedValue;
}

export default Home;
