FactoryGirl.define do
  factory :challenge do
    variant
    association :challenger, factory: :user
    play_as 'alabaster'
  end

  factory :game do
    action 'setup'
    association :alabaster, factory: :user
    association :onyx, factory: :user
    variant
  end

  factory :piece do
    game
    user
    piece_type
    coordinate { {'x' => 1, 'y' => 1} }
  end

  factory :piece_rule do
    capture_type PieceRule::CAPTURE_TYPES.first
    count_minimum 1
    count_maximum 1
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

  factory :terrain do
    terrain_type
  end

  factory :terrain_rule do
    block_movement false
    block_range false
    count 1
    terrain_type
    variant
  end

  factory :terrain_type do
    image File.open('spec/support/fake_image.svg')
    sequence(:name) {|n| "terrain #{n}" }
  end

  factory :variant do
    board_columns 8
    board_rows 8
    board_type 'square'
    sequence(:name) {|n| "variant #{n}" }
    number_of_pieces 10
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