require 'spec_helper'

describe Variant do
  context 'validating' do
    let(:variant) { build(:variant, variant_params) }
    let(:variant_params) { {} }

    context 'with the default factory' do
      specify { expect(variant).to be_valid }
    end

    context 'no board_type' do
      let(:variant_params) { {board_type: ''} }
      specify { expect(variant).to be_invalid }
    end

    context 'square board' do
      let(:variant) { build(:variant_with_square_board, variant_params) }

      context 'no board_columns' do
        let(:variant_params) { {board_columns: ''} }
        specify { expect(variant).to be_invalid }
      end

      context 'no board_rows' do
        let(:variant_params) { {board_rows: ''} }
        specify { expect(variant).to be_invalid }
      end
    end

    context 'hexagonal board' do
      let(:variant) { build(:variant_with_hexagonal_board, variant_params) }

      context 'no board_size' do
        let(:variant_params) { {board_size: ''} }
        specify { expect(variant).to be_invalid }
      end
    end

    context 'no user' do
      let(:variant_params) { {user: nil} }
      specify { expect(variant).to be_invalid }
    end

    context 'duplicate user' do
      let(:duplicate) { create(:variant) }
      let(:variant_params) { {user: duplicate.user} }
      specify { expect(variant).to be_invalid }
    end
  end

  context 'on create' do
    before do
      @king_piece_type = create(:piece_type, name: 'King')
      Variant.any_instance.unstub(:add_initial_king)
    end

    it 'adds a piece rule for the king' do
      expect {
        variant = create(:variant)
        expect(variant.piece_rules.count).to eql 1
        expect(variant.piece_rules[0].piece_type).to eql @king_piece_type
      }.to change(PieceRule, :count).by(1)
    end
  end

  context '#review_topic' do
    let(:variant) { create :variant }

    context 'does not exists' do
      it 'creates and returns a review topic' do
        expect{
          topic = variant.review_topic
          expect(topic).to be_a Topic
          expect(topic.title).to eql 'Reviews'
        }.to change(Topic, :count).by(1)
      end
    end

    context 'exists' do
      before { variant.review_topic }

      it 'returns the existing review topic' do
        expect{
          topic = variant.review_topic
          expect(topic).to be_a Topic
          expect(topic.title).to eql 'Reviews'
        }.to change(Topic, :count).by(0)
      end
    end
  end

  context '#square_board?' do
    context 'board_type == sqaure' do
      let(:variant) { build(:variant_with_square_board) }
      specify { expect(variant.square_board?).to be_true }
    end

    context 'board_type == hexagonal' do
      let(:variant) { build(:variant_with_hexagonal_board) }
      specify { expect(variant.square_board?).to be_false }
    end
  end

  context 'hexagonal_board?' do
    context 'board_type == sqaure' do
      let(:variant) { build(:variant_with_square_board) }
      specify { expect(variant.hexagonal_board?).to be_false }
    end

    context 'board_type == hexagonal' do
      let(:variant) { build(:variant_with_hexagonal_board) }
      specify { expect(variant.hexagonal_board?).to be_true }
    end
  end
end
