class SplitRanks < ActiveRecord::Migration
  def up
    rename_column :piece_rules, :rank, :attack_rank
    add_column :piece_rules, :defense_rank, :integer, default: 1
    PieceRule.update_all(defense_rank: 1)
  end

  def down
    rename_column :piece_rules, :attack_rank, :rank
    remove_column :piece_rules, :defense_rank
  end
end
