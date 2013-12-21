require 'spec_helper'

describe ApplicationAuthorizer do
  let(:user) { build(:user) }

  describe ".default" do
    specify { ApplicationAuthorizer.default('create', user).should be_false }
  end

  describe ".readable_by" do
    specify { ApplicationAuthorizer.readable_by?(user).should be_true }
  end

  describe "#managable_by" do
    specify { ApplicationAuthorizer.new(user).managable_by?(user).should be_false }
  end
end
