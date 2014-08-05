class ChangeRankDefault < ActiveRecord::Migration
  def up
    change_column_default :piece_rules, :rank, 1
    PieceRule.update_all(rank: 1)
  end

  def down
    change_column_default :piece_rules, :rank, nil
  end
end
