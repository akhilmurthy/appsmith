import React, { useCallback, useContext, useState } from "react";
import styles from "./styles.module.css";
import { Icon, Text } from "design-system";
import {
  EditorModes,
  EditorSize,
  EditorTheme,
  TabBehaviour,
} from "components/editorComponents/CodeEditor/EditorConfig";
import { CustomWidgetBuilderContext } from "../..";
import LazyCodeEditor from "components/editorComponents/LazyCodeEditor";

export default function Events() {
  const { events } = useContext(CustomWidgetBuilderContext);

  const [openState, setOpenState] = useState<Record<string, boolean>>({});

  const toggleOpen = useCallback((event: string) => {
    setOpenState((prev) => {
      return {
        ...prev,
        [event]: !prev[event],
      };
    });
  }, []);

  return (
    <div className={styles.events}>
      {events &&
        Object.keys(events)?.map((event) => {
          return (
            <div className={styles.event} key={event}>
              <div className={styles.eventName}>
                <div
                  className={styles.eventLabel}
                  onClick={() => toggleOpen(event)}
                >
                  {event}
                </div>
                <div
                  className={styles.eventControl}
                  onClick={() => toggleOpen(event)}
                >
                  <Icon
                    name={
                      openState[event] ? "arrow-down-s-line" : "arrow-up-s-line"
                    }
                    size="md"
                  />
                </div>
              </div>
              {openState[event] && (
                <div className={styles.eventValue}>
                  <LazyCodeEditor
                    disabled
                    evaluatedValue={events[event]}
                    hideEvaluatedValue
                    input={{
                      value: events[event],
                    }}
                    isReadOnly
                    mode={EditorModes.TEXT_WITH_BINDING}
                    placeholder="No action"
                    positionCursorInsideBinding
                    showCustomToolTipForHighlightedText={false}
                    showLightningMenu={false}
                    size={EditorSize.EXTENDED}
                    tabBehaviour={TabBehaviour.INDENT}
                    theme={EditorTheme.LIGHT}
                  />
                </div>
              )}
            </div>
          );
        })}
      {events && Object.keys(events).length === 0 && (
        <Text color="#6A7585" renderAs="p">
          You haven’t created any events. Return to the app editor to add events
          to this custom widget.
        </Text>
      )}
    </div>
  );
}
