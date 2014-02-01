require 'spec_helper'

describe "Game#valid_plies - range - board - hexagonal" do
  let(:piece_type) { create :piece_type }
  let!(:piece_rule) { create :piece_rule, {variant: variant, piece_type: piece_type, capture_type: 'range'}.merge(piece_rule_parameters) }

  let(:variant) { create :variant, board_type: 'hexagonal', board_size: 4  }

  let(:user1) { create :user }
  let(:user2) { create :user }
  let(:game) { create :game, variant: variant, alabaster: user1, onyx: user2, action: 'move', action_to: user1 }

  let(:piece) { create :piece, game: game, user: user1, piece_type: piece_type, coordinate: {'x' => 0, 'y' => 0, 'z' => 0} }

  context "valid_plies" do
    context 'orthogonal_line' do
      let(:piece_rule_parameters) { { range_type: 'orthogonal_line', range_minimum: 1, range_maximum: nil } }

      specify do
        expect( game.valid_plies(piece, 'range') ).to match_array [
          {"x"=>1, "y"=>0, "z"=>0}, {"x"=>2, "y"=>0, "z"=>0}, {"x"=>3, "y"=>0, "z"=>0},
          {"x"=>-1, "y"=>0, "z"=>0}, {"x"=>-2, "y"=>0, "z"=>0}, {"x"=>-3, "y"=>0, "z"=>0},
          {"x"=>0, "y"=>1, "z"=>0}, {"x"=>0, "y"=>2, "z"=>0}, {"x"=>0, "y"=>3, "z"=>0},
          {"x"=>0, "y"=>-1, "z"=>0}, {"x"=>0, "y"=>-2, "z"=>0}, {"x"=>0, "y"=>-3, "z"=>0},
          {"x"=>0, "y"=>0, "z"=>1}, {"x"=>0, "y"=>0, "z"=>2}, {"x"=>0, "y"=>0, "z"=>3},
          {"x"=>0, "y"=>0, "z"=>-1}, {"x"=>0, "y"=>0, "z"=>-2}, {"x"=>0, "y"=>0, "z"=>-3}
        ]
      end
    end

    context 'diagonal_line' do
      let(:piece_rule_parameters) { { range_type: 'diagonal_line', range_minimum: 1, range_maximum: nil } }

      specify do
        expect( game.valid_plies(piece, 'range') ).to match_array [
          {"x"=>1, "y"=>1, "z"=>0},
          {"x"=>-1, "y"=>-1, "z"=>0},
          {"x"=>1, "y"=>0, "z"=>-1},
          {"x"=>-1, "y"=>0, "z"=>1},
          {"x"=>0, "y"=>1, "z"=>1},
          {"x"=>0, "y"=>-1, "z"=>-1}
        ]
      end
    end

    context 'orthogonal_with_turns' do
      let(:piece_rule_parameters) { { range_type: 'orthogonal_with_turns', range_minimum: 2, range_maximum: 2 } }

      specify do
        expect( game.valid_plies(piece, 'range') ).to match_array [
          {"x"=>2, "y"=>0, "z"=>0}, {"x"=>1, "y"=>1, "z"=>0}, {"x"=>1, "y"=>0, "z"=>-1},
          {"x"=>-2, "y"=>0, "z"=>0}, {"x"=>-1, "y"=>-1, "z"=>0}, {"x"=>-1, "y"=>0, "z"=>1},
          {"x"=>0, "y"=>2, "z"=>0}, {"x"=>0, "y"=>1, "z"=>1}, {"x"=>0, "y"=>-2, "z"=>0},
          {"x"=>0, "y"=>-1, "z"=>-1}, {"x"=>0, "y"=>0, "z"=>2}, {"x"=>0, "y"=>0, "z"=>-2}
        ]
      end
    end

    context 'diagonal_with_turns' do
      let(:piece_rule_parameters) { { range_type: 'diagonal_with_turns', range_minimum: 2, range_maximum: 2 } }

      specify do
        expect( game.valid_plies(piece, 'range') ).to match_array [
          {"x"=>3, "y"=>0, "z"=>0},
          {"x"=>-3, "y"=>0, "z"=>0},
          {"x"=>0, "y"=>3, "z"=>0},
          {"x"=>0, "y"=>0, "z"=>3},
          {"x"=>0, "y"=>-3, "z"=>0},
          {"x"=>0, "y"=>0, "z"=>-3}
        ]
      end
    end
  end
end
