class CreateQuotes < ActiveRecord::Migration
  def change
    create_table :quotes do |t|
      t.integer :book_number
      t.string :book_name
      t.integer :chapter_number
      t.string :chapter_name
      t.string :description
      t.integer :number
      t.text :text
    end
  end
end
