class AddBlockRangeToTerrain < ActiveRecord::Migration
  def change
    add_column :terrain_rules, :block_range, :boolean
  end
end
