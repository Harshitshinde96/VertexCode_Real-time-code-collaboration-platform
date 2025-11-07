import React from "react";
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "@/components/ui/resizable";
import { OutputPanel } from "@/components/OutputPanel";
import InputPanel from "@/components/InputPanel"; // 1. Import new component

const BottomPanel = ({
  output,
  isWaitingForInput,
  onInputSubmit,
  isLoading,
  stdin,
  onStdinChange,
}) => {
  return (
    <div className="h-full flex flex-col">
      {/* 2. REMOVED the old tab bar div */}

      {/* 3. ResizablePanelGroup now fills the whole space */}
      <ResizablePanelGroup direction="horizontal" className="flex-1">
        <ResizablePanel defaultSize={60}>
          {/* 4. OutputPanel (which now has its own label) */}
          <OutputPanel
            output={output}
            isWaitingForInput={isWaitingForInput}
            onInputSubmit={onInputSubmit}
            isLoading={isLoading}
          />
        </ResizablePanel>
        <ResizableHandle withHandle />
        <ResizablePanel defaultSize={40}>
          {/* 5. Replaced textarea with new InputPanel component */}
          <InputPanel
            placeholder="Enter your program input here, separated by new lines..."
            value={stdin}
            onChange={onStdinChange}
          />
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
};

export default BottomPanel;
