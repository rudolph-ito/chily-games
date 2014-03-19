# encoding: UTF-8
# This file is auto-generated from the current state of the database. Instead
# of editing this file, please use the migrations feature of Active Record to
# incrementally modify your database, and then regenerate this schema definition.
#
# Note that this schema.rb definition is the authoritative source for your
# database schema. If you need to create the application database on another
# system, you should be using db:schema:load, not running all the migrations
# from scratch. The latter is a flawed and unsustainable approach (the more migrations
# you'll amass, the slower it'll run and the greater likelihood for issues).
#
# It's strongly recommended that you check this file into your version control system.

ActiveRecord::Schema.define(version: 20140310135742) do

  # These are extensions that must be enabled in order to support this database
  enable_extension "plpgsql"

  create_table "challenges", force: true do |t|
    t.integer  "challenged_id"
    t.integer  "challenger_id"
    t.string   "play_as"
    t.integer  "variant_id"
    t.datetime "created_at"
  end

  create_table "comments", force: true do |t|
    t.text     "text"
    t.integer  "topic_id"
    t.integer  "user_id"
    t.datetime "created_at"
    t.datetime "updated_at"
  end

  create_table "discussions", force: true do |t|
    t.string "title"
    t.text   "description"
  end

  create_table "games", force: true do |t|
    t.string   "action"
    t.integer  "action_to_id"
    t.integer  "alabaster_id"
    t.integer  "onyx_id"
    t.integer  "variant_id"
    t.datetime "started_at"
    t.datetime "finished_at"
    t.text     "initial_setup_json"
    t.text     "current_setup_json"
    t.text     "plies_json"
  end

  create_table "piece_rules", force: true do |t|
    t.integer "piece_type_id"
    t.integer "variant_id"
    t.integer "count"
    t.string  "movement_type"
    t.integer "movement_minimum"
    t.integer "movement_maximum"
    t.string  "capture_type"
    t.integer "range_minimum"
    t.integer "range_maximum"
    t.string  "range_type"
  end

  create_table "piece_types", force: true do |t|
    t.string "alabaster_image"
    t.string "name"
    t.string "onyx_image"
  end

  create_table "quotes", force: true do |t|
    t.integer "book_number"
    t.string  "book_name"
    t.integer "chapter_number"
    t.string  "chapter_name"
    t.string  "description"
    t.integer "number"
    t.text    "text"
  end

  create_table "ratings", force: true do |t|
    t.float   "value"
    t.integer "variant_id"
    t.integer "user_id"
  end

  create_table "terrain_rules", force: true do |t|
    t.integer "terrain_type_id"
    t.integer "variant_id"
    t.integer "count"
    t.string  "block_movement_type"
    t.text    "block_movement_piece_type_ids"
    t.string  "block_range_type"
    t.text    "block_range_piece_type_ids"
  end

  create_table "terrain_types", force: true do |t|
    t.string "image"
    t.string "name"
  end

  create_table "topics", force: true do |t|
    t.string   "title"
    t.integer  "parent_id"
    t.string   "parent_type"
    t.integer  "user_id"
    t.integer  "comments_count"
    t.datetime "created_at"
  end

  create_table "users", force: true do |t|
    t.string   "username",               default: "",    null: false
    t.string   "email",                  default: "",    null: false
    t.boolean  "admin",                  default: false, null: false
    t.datetime "created_at"
    t.datetime "updated_at"
    t.string   "encrypted_password",     default: "",    null: false
    t.string   "reset_password_token"
    t.datetime "reset_password_sent_at"
    t.datetime "remember_created_at"
    t.integer  "sign_in_count",          default: 0,     null: false
    t.datetime "current_sign_in_at"
    t.datetime "last_sign_in_at"
    t.string   "current_sign_in_ip"
    t.string   "last_sign_in_ip"
    t.integer  "failed_attempts",        default: 0,     null: false
    t.string   "unlock_token"
    t.datetime "locked_at"
    t.boolean  "creator",                default: false
  end

  add_index "users", ["email"], name: "index_users_on_email", unique: true, using: :btree
  add_index "users", ["reset_password_token"], name: "index_users_on_reset_password_token", unique: true, using: :btree

  create_table "variants", force: true do |t|
    t.integer  "board_columns"
    t.integer  "board_rows"
    t.integer  "board_size"
    t.string   "board_type"
    t.integer  "user_id"
    t.datetime "created_at"
    t.datetime "updated_at"
  end

  add_index "variants", ["user_id"], name: "index_variants_on_user_id", unique: true, using: :btree

end
