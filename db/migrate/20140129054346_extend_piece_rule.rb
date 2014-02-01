class ExtendPieceRule < ActiveRecord::Migration
  def change
    change_table :piece_rules do |t|
      t.string :capture_type
      t.integer :range_minimum
      t.integer :range_maximum
      t.string :range_type
    end
  end
end
