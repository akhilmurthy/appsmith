import React, { useCallback, useEffect, useMemo, useState } from "react";
import Header from "./header";
import styles from "./styles.module.css";
import Preview from "./Preview";
import Editor from "./Editor";
import { CUSTOM_WIDGET_BUILDER_EVENTS } from "./contants";
import { Spinner } from "design-system";
import history from "utils/history";

interface CustomWidgetBuilderContextValueType {
  name: string;
  isReferenceOpen: boolean;
  selectedLayout: string;
  srcDoc: {
    html: string;
    js: string;
    css: string;
  };
  model: Record<string, unknown>;
  events: Record<string, string>;
  key: number;
  lastSaved?: number;
  initialSrcDoc?: CustomWidgetBuilderContextValueType["srcDoc"];
}

interface CustomWidgetBuilderContextFunctionType {
  toggleReference: () => void;
  selectLayout: (layout: string) => void;
  save: () => void;
  discard: () => void;
  update: (editor: string, value: string) => void;
  updateModel: (model: Record<string, unknown>) => void;
  bulkUpdate: (srcDoc: CustomWidgetBuilderContextValueType["srcDoc"]) => void;
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
      isReferenceOpen: true,
      selectedLayout: "tabs",
      srcDoc: {
        html: "<div>Hello World</div>",
        js: "function () {console.log('Hello World');}",
        css: "div {color: red;}",
      },
      model: {},
      events: {},
      key: Math.random(),
    });

  useEffect(() => {
    if (contextValue.lastSaved) {
      window.parent.postMessage(
        {
          type: CUSTOM_WIDGET_BUILDER_EVENTS.UPDATE_SRCDOC,
          srcDoc: contextValue.srcDoc,
        },
        "*",
      );
    }
  }, [contextValue.srcDoc, contextValue.lastSaved]);

  const replay = useCallback(() => {
    setContextValue((prev) => {
      return {
        ...prev,
        key: Math.random(),
      };
    });
  }, []);

  const contextFunctions: CustomWidgetBuilderContextFunctionType = useMemo(
    () => ({
      toggleReference: () => {
        setContextValue((prev) => {
          return {
            ...prev,
            isReferenceOpen: !prev.isReferenceOpen,
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
      },
      discard: () => {
        window.parent.focus();
        window.close();
      },
      bulkUpdate: (srcDoc: CustomWidgetBuilderContextValueType["srcDoc"]) => {
        setContextValue((prev) => {
          return {
            ...prev,
            srcDoc,
            lastSaved: Date.now(),
          };
        });
      },
      update: (editor, value) => {
        setContextValue((prev) => {
          return {
            ...prev,
            srcDoc: {
              ...prev.srcDoc,
              [editor]: value,
            },
            lastSaved: Date.now(),
          };
        });
      },
      updateModel: (model: Record<string, unknown>) => {
        setContextValue((prev) => {
          return {
            ...prev,
            model: {
              ...prev.model,
              ...model,
            },
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

  useEffect(replay, [contextValue.srcDoc]);

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
              initialSrcDoc: event.data.srcDoc,
              model: event.data.model,
              transientModel: event.data.model,
              events: event.data.events,
            };
          });
          setLoading(false);
          break;
        case CUSTOM_WIDGET_BUILDER_EVENTS.UPDATE_REFERENCES:
          setContextValue((prev) => {
            return {
              ...prev,
              name: event.data.name,
              model: event.data.model,
              transientModel: event.data.model,
              events: event.data.events,
            };
          });
          replay();
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

    window.addEventListener("beforeunload", () => {
      window.parent.postMessage(
        {
          type: CUSTOM_WIDGET_BUILDER_EVENTS.DISCONNECTED,
        },
        "*",
      );
    });

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
