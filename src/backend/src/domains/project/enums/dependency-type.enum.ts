export enum DependencyType {
  FINISH_TO_START = 'finish_to_start', // Task B starts after Task A finishes
  START_TO_START = 'start_to_start', // Task B starts when Task A starts
  FINISH_TO_FINISH = 'finish_to_finish', // Task B finishes when Task A finishes
  START_TO_FINISH = 'start_to_finish', // Task B finishes when Task A starts
}
