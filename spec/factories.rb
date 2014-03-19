FactoryGirl.define do
  factory :challenge do
    variant
    association :challenger, factory: :user
    play_as 'alabaster'
  end

  factory :comment do
    topic
    text 'A comment'
    user
  end

  factory :discussion do
    sequence(:title) {|n| "discussion #{n}" }
    description 'a discussion'
  end

  factory :game do
    action 'setup'
    association :alabaster, factory: :user
    association :onyx, factory: :user
    variant
  end

  factory :piece_rule do
    capture_type PieceRule::CAPTURE_TYPES.first
    count 1
    movement_minimum 1
    movement_maximum 1
    movement_type PieceRule::DIRECTIONS.first
    piece_type
    range_minimum 1
    range_maximum 1
    range_type PieceRule::DIRECTIONS.first
    variant
  end

  factory :piece_type do
    sequence(:name) {|n| "piece #{n}" }
    onyx_image File.open('spec/support/fake_image.svg')
    alabaster_image File.open('spec/support/fake_image.svg')
  end

  factory :quote do
    book_name 'A Feast for Crows'
    book_number 4
    chapter_name 'The Soiled Knight'
    chapter_number 13
    description 'Introduction'
    number 1
    text '*Cyvasse*, the game was called.'
  end

  factory :rating do
    value 0
    variant
    user
  end

  factory :terrain_rule do
    block_movement_type 'none'
    block_movement_piece_type_ids []
    block_range_type 'none'
    block_range_piece_type_ids []
    count 1
    terrain_type
    variant
  end

  factory :terrain_type do
    image File.open('spec/support/fake_image.svg')
    sequence(:name) {|n| "terrain #{n}" }
  end

  factory :topic do
    association :parent, factory: :discussion
    sequence(:title) {|n| "topic #{n}" }
    user

    after(:build) do |topic|
      topic.comments << build(:comment, topic: topic)
    end
  end

  factory :variant do
    board_columns 8
    board_rows 8
    board_type 'square'
    user

    factory :variant_with_square_board do
    end

    factory :variant_with_hexagonal_board do
      board_size 6
      board_type 'hexagonal'
    end
  end

  factory :user do
    sequence(:username) {|n| "user#{n}name" }
    sequence(:email) {|n| "user#{n}@example.com" }
    password "12345678"
    password_confirmation "12345678"
    admin false
  end
end