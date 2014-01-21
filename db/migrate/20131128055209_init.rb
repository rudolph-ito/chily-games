class Init < ActiveRecord::Migration
  def change
    create_table :challenges do |t|
      t.integer :challenged_id
      t.integer :challenger_id
      t.string :play_as
      t.integer :variant_id

      t.datetime :created_at
    end

    create_table :games do |t|
      t.string  :action
      t.integer :action_to_id
      t.integer :alabaster_id
      t.integer :onyx_id
      t.integer :variant_id

      t.datetime :started_at
      t.datetime :finished_at
    end

    create_table :pieces do |t|
      t.string :encoded_coordinate
      t.integer :game_id
      t.integer :piece_type_id
      t.integer :user_id
    end

    create_table :piece_rules do |t|
      t.integer :piece_type_id
      t.integer :variant_id
      t.integer :count_minimum
      t.integer :count_maximum
      t.string :movement_type
      t.integer :movement_minimum
      t.integer :movement_maximum
    end

    create_table :piece_types do |t|
      t.string :alabaster_image
      t.string :name
      t.string :onyx_image
    end

    create_table :terrains do |t|
      t.string :encoded_coordinate
      t.integer :game_id
      t.integer :terrain_type_id
      t.integer :user_id
    end

    create_table :terrain_rules do |t|
      t.integer :terrain_type_id
      t.integer :variant_id
      t.boolean :block_movement
    end

    create_table :terrain_types do |t|
      t.string :image
      t.string :name
    end

    create_table :users do |t|
      t.string :username, :null => false, :default => ""
      t.string :email,    :null => false, :default => ""
      t.boolean :admin,   :null => false, :default => false

      t.timestamps

      # Devise

      ## Database authenticatable
      t.string :encrypted_password, :null => false, :default => ""

      ## Recoverable
      t.string   :reset_password_token
      t.datetime :reset_password_sent_at

      ## Rememberable
      t.datetime :remember_created_at

      ## Trackable
      t.integer  :sign_in_count, :default => 0, :null => false
      t.datetime :current_sign_in_at
      t.datetime :last_sign_in_at
      t.string   :current_sign_in_ip
      t.string   :last_sign_in_ip

      ## Lockable
      t.integer  :failed_attempts, :default => 0, :null => false
      t.string   :unlock_token
      t.datetime :locked_at
    end

    add_index :users, :email,                :unique => true
    add_index :users, :reset_password_token, :unique => true

    create_table :variants do |t|
      t.integer :board_columns
      t.integer :board_rows
      t.integer :board_size
      t.string :board_type
      t.string :description
      t.string :name
      t.integer :number_of_pieces
      t.integer :user_id

      t.timestamps
    end

  end
end
