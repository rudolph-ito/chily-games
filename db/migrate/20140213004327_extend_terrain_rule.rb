class ExtendTerrainRule < ActiveRecord::Migration
  def change
    change_table :terrain_rules do |t|
      t.remove :block_movement
      t.string :block_movement_effect_type
      t.text :block_movement_effect_piece_type_ids

      t.remove :block_range
      t.string :block_range_effect_type
      t.text :block_range_effect_piece_type_ids
    end
  end
end
