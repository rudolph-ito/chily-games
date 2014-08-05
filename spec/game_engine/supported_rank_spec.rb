require 'minimal_spec_helper'
require ROOT_DIRECTORY + '/app/game_engine/supported_rank.rb'

describe SupportedRank do
  context '.calculate' do
    let(:result) { SupportedRank.new(rank, support_type, supporter_ranks).calculate }
    let(:rank) { 1 }

    context 'support_type == none' do
      let(:support_type) { 'none' }
      let(:supporter_ranks) { [] }

      it 'returns rank' do
        expect(result).to eql(1)
      end
    end

    context 'support_type == binary' do
      let(:support_type) { 'binary' }

      context 'one supports of rank 1' do
        let(:supporter_ranks) { [1] }

        it 'returns 2' do
          expect(result).to eql(2)
        end
      end

      context 'two supports of rank 1' do
        let(:supporter_ranks) { [1, 1] }

        it 'returns 2' do
          expect(result).to eql(2)
        end
      end

      context 'one support of rank 1, one support of rank 2' do
        let(:supporter_ranks) { [1, 2] }

        it 'returns 3' do
          expect(result).to eql(3)
        end
      end

      context 'one support of rank 1, one support of rank 2, one support of rank 3' do
        let(:supporter_ranks) { [1, 2, 3] }

        it 'returns 4' do
          expect(result).to eql(4)
        end
      end
    end

    context 'support_type == sum' do
      let(:support_type) { 'sum' }

      context 'one supports of rank 1' do
        let(:supporter_ranks) { [1] }

        it 'returns 2' do
          expect(result).to eql(2)
        end
      end

      context 'two supports of rank 1' do
        let(:supporter_ranks) { [1, 1] }

        it 'returns 3' do
          expect(result).to eql(3)
        end
      end

      context 'one support of rank 1, one support of rank 2' do
        let(:supporter_ranks) { [1, 2] }

        it 'returns 4' do
          expect(result).to eql(4)
        end
      end

      context 'one support of rank 1, one support of rank 2, one support of rank 3' do
        let(:supporter_ranks) { [1, 2, 3] }

        it 'returns 7' do
          expect(result).to eql(7)
        end
      end
    end
  end
end
