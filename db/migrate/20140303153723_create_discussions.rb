class CreateDiscussions < ActiveRecord::Migration
  def change
    create_table :comments do |t|
      t.integer :commentable_id
      t.string :commentable_type
      t.text :text
      t.integer :user_id

      t.datetime :created_at
      t.datetime :updated_at
    end

    create_table :discussions do |t|
      t.string :title
      t.text :description
      t.integer :user_id
    end

    create_table :topics do |t|
      t.integer :discussion_id
      t.string :title
      t.integer :user_id

      t.integer :comments_count

      t.datetime :created_at
    end
  end
end
