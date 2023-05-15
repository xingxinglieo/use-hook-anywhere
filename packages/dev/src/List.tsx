import React from "react";
import { Pagination } from "antd";
import { useModel } from "@modern-js-reduck/react";
import { listModel } from "./listModel";

export function List() {
  const [
    {
      pagination: { data, loading, pagination }
    }
  ] = useModel(listModel);
  return (
    <div>
      {loading ? (
        <p>loading</p>
      ) : (
        <ul>
          {data?.list?.map((item) => (
            <li key={item.email}>
              {item.name} - {item.email}
            </li>
          ))}
        </ul>
      )}
      <Pagination
        current={pagination.current}
        pageSize={pagination.pageSize}
        total={data?.total}
        onChange={pagination.onChange}
        onShowSizeChange={pagination.onChange}
        showQuickJumper
        showSizeChanger
        style={{ marginTop: 16, textAlign: "right" }}
      />
    </div>
  );
}
