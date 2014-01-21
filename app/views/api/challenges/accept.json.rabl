object false
node(:challenge_id) { @challenge.id }

child(@game) do
  attributes :id, :alabaster_id, :onyx_id
end
