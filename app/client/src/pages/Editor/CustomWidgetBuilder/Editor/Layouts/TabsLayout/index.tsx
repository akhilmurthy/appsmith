import React, { useEffect, useRef } from "react";
import styles from "./styles.module.css";
import { Tab, TabPanel, Tabs, TabsList } from "design-system";
import type { ContentProps } from "../../CodeEditors/types";

interface Props {
  tabs: Array<{
    title: string;
    children: (props: ContentProps) => React.ReactNode;
  }>;
}

export default function TabLayout(props: Props) {
  const { tabs } = props;

  const [selectedTab, setSelectedTab] = React.useState(tabs[0].title);

  const containerRef = useRef<HTMLDivElement>(null);

  const [height, setHeight] = React.useState(0);

  useEffect(() => {
    if (containerRef.current) {
      setHeight(
        window.innerHeight - containerRef.current.getBoundingClientRect().top,
      );
    }
  }, []);

  return (
    <div className={styles.wrapper} ref={containerRef}>
      <Tabs
        onValueChange={(tab: string) => {
          setSelectedTab(tab);
        }}
        value={selectedTab}
      >
        <TabsList>
          {tabs.map((tab) => (
            <Tab key={tab.title} value={tab.title}>
              {tab.title}
            </Tab>
          ))}
        </TabsList>
        {tabs.map((tab) => (
          <TabPanel
            className={styles.tabPanel}
            key={tab.title}
            value={tab.title}
          >
            {tab.children({
              height: height,
              showHeader: false,
              width: "100%",
            })}
          </TabPanel>
        ))}
      </Tabs>
    </div>
  );
}