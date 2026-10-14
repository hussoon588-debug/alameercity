import {
  pgTable,
  serial,
  text,
  integer,
  timestamp,
  real,
  boolean,
} from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  phone: text("phone"),
  email: text("email"),
  role: text("role").default("mayor"),
  balance: integer("balance").default(0),
  xp: integer("xp").default(0),
  level: integer("level").default(1),
  createdAt: timestamp("created_at").defaultNow(),
});

export const properties = pgTable("properties", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  code: text("code").notNull(),
  type: text("type").notNull(),
  district: text("district").notNull(),
  area: integer("area").notNull(),
  price: integer("price").notNull(),
  status: text("status").default("available"),
  owner: text("owner").default("مدينة الأمير"),
  roi: real("roi").default(0),
  bedrooms: integer("bedrooms").default(0),
  bathrooms: integer("bathrooms").default(0),
  description: text("description"),
  featured: boolean("featured").default(false),
  posX: integer("pos_x").default(0),
  posY: integer("pos_y").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

export const auctions = pgTable("auctions", {
  id: serial("id").primaryKey(),
  propertyId: integer("property_id"),
  title: text("title").notNull(),
  startPrice: integer("start_price").notNull(),
  currentBid: integer("current_bid").notNull(),
  minIncrement: integer("min_increment").default(5000),
  endsAt: timestamp("ends_at"),
  status: text("status").default("live"),
  bidsCount: integer("bids_count").default(0),
  leader: text("leader").default("—"),
  district: text("district").default(""),
  createdAt: timestamp("created_at").defaultNow(),
});

export const bids = pgTable("bids", {
  id: serial("id").primaryKey(),
  auctionId: integer("auction_id").notNull(),
  bidderName: text("bidder_name").notNull(),
  amount: integer("amount").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const transactions = pgTable("transactions", {
  id: serial("id").primaryKey(),
  type: text("type").notNull(),
  amount: integer("amount").notNull(),
  description: text("description"),
  status: text("status").default("completed"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const agents = pgTable("agents", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  phone: text("phone"),
  district: text("district"),
  specialty: text("specialty"),
  rating: real("rating").default(4.5),
  deals: integer("deals").default(0),
  commission: integer("commission").default(0),
  experience: integer("experience").default(1),
  status: text("status").default("online"),
  color: text("color").default("#F5C451"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const clients = pgTable("clients", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  phone: text("phone"),
  email: text("email"),
  interest: text("interest"),
  budget: integer("budget").default(0),
  status: text("status").default("new"),
  agentName: text("agent_name").default(""),
  source: text("source").default("المنصة"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const appointments = pgTable("appointments", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  clientName: text("client_name").notNull(),
  agentName: text("agent_name").default(""),
  propertyCode: text("property_code").default(""),
  dateText: text("date_text").notNull(),
  timeText: text("time_text").notNull(),
  type: text("type").default("viewing"),
  status: text("status").default("pending"),
  notes: text("notes").default(""),
  createdAt: timestamp("created_at").defaultNow(),
});

export const offers = pgTable("offers", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  propertyCode: text("property_code").default(""),
  oldPrice: integer("old_price").notNull(),
  newPrice: integer("new_price").notNull(),
  discount: integer("discount").default(0),
  expiresAt: text("expires_at").default(""),
  status: text("status").default("active"),
  description: text("description").default(""),
  tag: text("tag").default("حصري"),
  createdAt: timestamp("created_at").defaultNow(),
});
