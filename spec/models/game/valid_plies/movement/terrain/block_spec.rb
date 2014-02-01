require 'spec_helper'

describe "Game#valid_plies - movement - terrain - block" do
  let(:piece_type) { create :piece_type }
  let!(:piece_rule) { create :piece_rule, variant: variant, piece_type: piece_type, movement_type: 'orthogonal_line', movement_maximum: nil }

  let(:terrain_type) { create :terrain_type }
  let!(:terrain_rule) { create :terrain_rule, variant: variant, terrain_type: terrain_type, block_movement: true }

  let(:variant) { create :variant, board_type: 'square', board_rows: 4, board_columns: 4 }

  let(:user1) { create :user }
  let(:user2) { create :user }
  let(:game) { create :game, variant: variant, alabaster: user1, onyx: user2, action: 'move', action_to: user1 }

  let(:piece) { create :piece, game: game, user: user1, piece_type: piece_type, coordinate: {'x' => 2, 'y' => 2} }

  before do
    game.terrains.create!(terrain_type: terrain_type, user: user1, coordinate: {'x' => 2, 'y' => 0})
    game.terrains.create!(terrain_type: terrain_type, user: user2, coordinate: {'x' => 1, 'y' => 2})
  end

  specify do
    expect( game.valid_plies(piece, 'movement') ).to match_array [{"x"=>3, "y"=>2}, {"x"=>2, "y"=>3}, {"x"=>2, "y"=>1}]
  end
end
