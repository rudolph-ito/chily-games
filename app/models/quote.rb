class Quote < ActiveRecord::Base
  include Authority::Abilities

  default_scope { order('book_number asc, chapter_number asc, number asc') }

  ########################################
  # Validations
  ########################################

  validates :book_number, :chapter_number, :number, presence: true, numericality: { only_integer: true, greater_than_or_equal_to: 1 }
  validates :book_name, :chapter_name, :description, :text, presence: true

  ########################################
  # Instance Methods
  ########################################

  def html
    markdown = Redcarpet::Markdown.new(Redcarpet::Render::HTML)
    markdown.render(text).html_safe
  end

end
