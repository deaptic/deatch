import Item from "./Item.tsx";
import Context from "./Context.tsx";
import Note from "./Note.tsx";
import Title from "./Title.tsx";
import Content from "./Content.tsx";
import Detail from "./Detail.tsx";
import Tile from "./Tile.tsx";

export type { ItemLayout, RowTone } from "./Item.tsx";
export type { NoteAction } from "./Note.tsx";

const FeedItem = Object.assign(Item, {
  Context,
  Note,
  Title,
  Content,
  Detail,
  Tile,
});

export default FeedItem;
