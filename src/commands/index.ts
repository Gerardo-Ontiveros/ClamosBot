import { ManageCommands } from "./dynamic/commandService";
import { Commands } from "./static/commands";
import { Deck } from "./static/deck";
import { Ping } from "./static/ping";
import { Prediction } from "./static/predictions";
import { Rank } from "./static/rank";
import { Title } from "./static/title";
import { StartTracker, StopTracker } from "./static/trackerControl";

export const staticCommands = [
  Ping,
  ManageCommands,
  Commands,
  Title,
  Prediction,
  Rank,
  Deck,
  StartTracker,
  StopTracker,
];
