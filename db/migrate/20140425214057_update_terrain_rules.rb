class UpdateTerrainRules < ActiveRecord::Migration
  def change
    change_table :terrain_rules do |t|
      t.rename :block_movement_effect_type, :passable_movement_effect_type
      t.rename :block_movement_effect_piece_type_ids, :passable_movement_effect_piece_type_ids
      t.boolean

      t.rename :block_range_effect_type, :passable_range_effect_type
      t.rename :block_range_effect_piece_type_ids, :passable_range_effect_piece_type_ids

      t.integer :slows_movement_by
      t.string :slows_movement_effect_type
      t.text :slows_movement_effect_piece_type_ids

      t.string :stops_movement_effect_type
      t.text :stops_movement_effect_piece_type_ids
    end
  end
end
