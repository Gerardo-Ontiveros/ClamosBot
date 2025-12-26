import { ManageCommands } from "./dynamic/commandService";
import { Commands } from "./static/commands";
import { Deck } from "./static/deck";
import { Game } from "./static/game";
import { Ping } from "./static/ping";
import { ClosePred, Prediction, WinBlue, WinPink } from "./static/predictions";
import { Rank } from "./static/rank";
import { Ruleta } from "./static/ruleta";
import { Title } from "./static/title";
import {
  ResetTracker,
  StartTracker,
  StopTracker,
} from "./static/trackerControl";

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
  ResetTracker,
  Ruleta,
  WinBlue,
  WinPink,
  ClosePred,
  Game,
];
