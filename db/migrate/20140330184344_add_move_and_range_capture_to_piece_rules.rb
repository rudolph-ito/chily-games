class AddMoveAndRangeCaptureToPieceRules < ActiveRecord::Migration
  def change
    add_column :piece_rules, :move_and_range_capture, :boolean
  end
end
