class AddSupportTypeToVariants < ActiveRecord::Migration
  def up
    change_column_default :variants, :piece_ranks, nil
    add_column :variants, :support_type, :string
  end

  def down
    change_column_default :variants, :piece_ranks, false
    remove_column :variants, :support_type
  end
end
