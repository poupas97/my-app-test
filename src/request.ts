import axios from "axios";

const config = {
  baseURL: "https://dev.checks-api.putzmeister.com/api",
  headers: {
    common: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
  },
};

export const api = axios.create(config);

export const makeApiRequest = async <D = any, P = Record<string, unknown>>(
  path: string,
  method = "GET",
  payload?: P
) => {
  await new Promise((resolve) => setTimeout(resolve, 3000));

  // const response = await api.request<D>({
  //   data: payload,
  //   method,
  //   url: path,
  // });

  // return response.data;
};
