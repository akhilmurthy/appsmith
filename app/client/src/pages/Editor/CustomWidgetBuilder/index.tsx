import React, { useEffect, useMemo, useState } from "react";
import Header from "./header";
import styles from "./styles.module.css";
import Preview from "./Preview";
import Editor from "./Editor";
import { CUSTOM_WIDGET_BUILDER_EVENTS } from "./contants";
import { Spinner } from "design-system";
import history from "utils/history";

interface CustomWidgetBuilderContextValueType {
  name: string;
  isReferrenceOpen: boolean;
  selectedLayout: string;
  srcDoc: {
    html: string;
    js: string;
    css: string;
  };
  model: Record<string, unknown>;
  transientModel: Record<string, unknown>;
  useTransientModel: boolean;
  events: Record<string, string>;
  saving: boolean;
}

interface CustomWidgetBuilderContextFunctionType {
  toggleReferrence: () => void;
  selectLayout: (layout: string) => void;
  save: () => void;
  discard: () => void;
  update: (editor: string, value: string) => void;
  updateModel: (model: Record<string, unknown>) => void;
  toggleUseTransientModel: () => void;
}

interface CustomWidgetBuilderContextType
  extends CustomWidgetBuilderContextValueType,
    CustomWidgetBuilderContextFunctionType {}

export const CustomWidgetBuilderContext = React.createContext<
  Partial<CustomWidgetBuilderContextType>
>({});

let connectionTimeout: number;

export default function CustomWidgetBuilder() {
  const [loading, setLoading] = useState(true);

  const [contextValue, setContextValue] =
    useState<CustomWidgetBuilderContextValueType>({
      name: "",
      isReferrenceOpen: true,
      selectedLayout: "tabs",
      srcDoc: {
        html: "<div>Hello World</div>",
        js: "function () {console.log('Hello World');}",
        css: "div {color: red;}",
      },
      model: {},
      transientModel: {},
      events: {},
      saving: false,
      useTransientModel: true,
    });

  const contextFunctions: CustomWidgetBuilderContextFunctionType = useMemo(
    () => ({
      toggleReferrence: () => {
        setContextValue((prev) => {
          return {
            ...prev,
            isReferrenceOpen: !prev.isReferrenceOpen,
          };
        });
      },
      selectLayout: (layout) => {
        setContextValue((prev) => {
          return {
            ...prev,
            selectedLayout: layout,
          };
        });
      },
      save: () => {
        setContextValue((prev) => {
          return {
            ...prev,
            saving: true,
          };
        });

        window.parent.postMessage(
          {
            type: CUSTOM_WIDGET_BUILDER_EVENTS.UPDATE_SRCDOC,
            srcDoc: contextValue.srcDoc,
          },
          "*",
        );
      },
      discard: () => {
        window.parent.focus();
        window.close();
      },
      update: (editor, value) => {
        setContextValue((prev) => {
          return {
            ...prev,
            srcDoc: {
              ...prev.srcDoc,
              [editor]: value,
            },
          };
        });
      },
      updateModel: (transientModel: Record<string, unknown>) => {
        setContextValue((prev) => {
          return {
            ...prev,
            transientModel: {
              ...prev.transientModel,
              ...transientModel,
            },
          };
        });
      },
      toggleUseTransientModel: () => {
        setContextValue((prev) => {
          return {
            ...prev,
            useTransientModel: !prev.useTransientModel,
          };
        });
      },
    }),
    [contextValue.srcDoc],
  );

  const context = useMemo(
    () => ({
      ...contextValue,
      ...contextFunctions,
    }),
    [contextValue, contextFunctions],
  );

  useEffect(() => {
    window.addEventListener("message", (event: any) => {
      switch (event.data.type) {
        case CUSTOM_WIDGET_BUILDER_EVENTS.READY_ACK:
          connectionTimeout && clearTimeout(connectionTimeout);
          setContextValue((prev) => {
            return {
              ...prev,
              name: event.data.name,
              srcDoc: event.data.srcDoc,
              model: event.data.model,
              transientModel: event.data.model,
              events: event.data.events,
            };
          });
          setLoading(false);
          break;
        case CUSTOM_WIDGET_BUILDER_EVENTS.UPDATE_REFERRENCES:
          setContextValue((prev) => {
            return {
              ...prev,
              name: event.data.name,
              model: event.data.model,
              transientModel: event.data.model,
              events: event.data.events,
            };
          });
          break;
        case CUSTOM_WIDGET_BUILDER_EVENTS.UPDATE_SRCDOC_ACK:
          setContextValue((prev) => {
            return {
              ...prev,
              saving: false,
            };
          });
          break;
      }
    });

    window.parent.postMessage(
      {
        type: CUSTOM_WIDGET_BUILDER_EVENTS.READY,
      },
      "*",
    );

    connectionTimeout = setTimeout(() => {
      history.replace(window.location.pathname.replace("/builder", ""));
    }, 2000);
  }, []);

  return (
    <CustomWidgetBuilderContext.Provider value={context}>
      <Header />
      {loading ? (
        <Spinner className={styles.loader} size="lg" />
      ) : (
        <div className={styles.content}>
          <Preview />
          <Editor />
        </div>
      )}
    </CustomWidgetBuilderContext.Provider>
  );
}

export { Header as CustomWidgetBuilderHeader };
