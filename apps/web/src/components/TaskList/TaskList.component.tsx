import { ScrollArea } from "@/components/ui/scroll-area";
import { TaskRow } from "@/components/TaskRow";
import type { TaskListProps } from "./TaskList.types";

export const TaskList = ({ tasks, manager, emptyLabel }: TaskListProps) => {
  if (tasks.length === 0) {
    return (
      <div className="flex min-h-80 items-center justify-center rounded-lg border border-dashed bg-muted/25 p-8 text-sm text-muted-foreground">
        {emptyLabel}
      </div>
    );
  }

  return (
    <ScrollArea className="h-[520px] pr-3">
      <div className="flex flex-col gap-3">
        {tasks.map((task) => (
          <TaskRow key={task.localId} task={task} manager={manager} />
        ))}
      </div>
    </ScrollArea>
  );
};
