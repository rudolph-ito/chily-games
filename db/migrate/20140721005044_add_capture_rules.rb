class AddCaptureRules < ActiveRecord::Migration
  def change
    change_table :variants do |t|
      t.boolean :piece_ranks, default: false
    end

    change_table :piece_rules do |t|
      t.integer :rank
    end
  end
end
