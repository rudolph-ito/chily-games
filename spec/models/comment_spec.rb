require 'spec_helper'

describe Comment do
  context 'validating' do
    let(:comment) { build(:comment, comment_params) }
    let(:comment_params) { {} }

    context 'with the default factory' do
      specify { expect(comment).to be_valid }
    end

    context 'no commentable' do
      let(:comment_params) { {commentable: nil} }
      specify { expect(comment).to be_invalid }
    end

    context 'no text' do
      let(:comment_params) { {text: nil} }
      specify { expect(comment).to be_invalid }
    end

    context 'no user' do
      let(:comment_params) { {user: nil} }
      specify { expect(comment).to be_invalid }
    end
  end
end
