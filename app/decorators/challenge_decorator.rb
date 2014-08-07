class ChallengeDecorator < Draper::Decorator
  delegate_all
  decorates_association :variant
end
