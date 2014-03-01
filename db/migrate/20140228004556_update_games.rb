class UpdateGames < ActiveRecord::Migration
  def change
    change_table :games do |t|
      t.text :initial_setup_json
      t.text :current_setup_json
      t.text :plies_json
    end

    drop_table :pieces
    drop_table :terrains
  end
end
