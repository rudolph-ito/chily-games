class SimplifyPieceRuleCount < ActiveRecord::Migration
  def change
    rename_column :piece_rules, :count_minimum, :count
    remove_column :piece_rules, :count_maximum
    remove_column :variants, :number_of_pieces
  end
end
