class AddCountToTerrainRule < ActiveRecord::Migration
  def change
    add_column :terrain_rules, :count, :integer
  end
end
